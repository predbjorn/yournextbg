package com.yournextbg.app.data.api

import com.yournextbg.app.BuildConfig
import com.yournextbg.app.data.supabase.SupabaseService
import com.yournextbg.app.generated.api.DefaultApi
import com.yournextbg.app.generated.models.BggSyncRequest
import com.yournextbg.app.generated.models.BggSyncResponse
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.contextual
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.UUID

/**
 * Thin wrapper over the auto-generated [DefaultApi] from `contract/openapi.yaml`.
 *
 * Why this layer exists:
 *  - The generated client knows nothing about Supabase auth — we inject the
 *    user's bearer token from supabase-kt's [SessionStatus] before each call.
 *  - It anchors to `BuildConfig.SUPABASE_URL` so dev/prod swap with one config
 *    flip (rather than the hard-coded `ApiClient.BASE_URL`).
 *  - Consumers depend on this interface, never on generated types directly.
 *    If the OpenAPI generator output shifts on upgrade, only this file
 *    changes; ViewModels and screens stay untouched.
 *
 * Operations exposed:
 *  - [bggSync] — POST /bgg-sync (Bearer-authenticated, user-scoped).
 *
 * Deliberately NOT exposed:
 *  - resizeCover — service-role only, called by pg_cron inside Supabase. The
 *    device never invokes this. The generated client emits it; we don't.
 */
class EdgeFunctions internal constructor(
    private val api: DefaultApi,
    private val accessTokenProvider: suspend () -> String?,
) {

    /**
     * Sync the signed-in user's owned + wishlist collections from BGG.
     * @return counts of owned, wishlist, and newly inserted unscored games.
     * @throws IllegalStateException if no session is available (call after auth).
     */
    suspend fun bggSync(): BggSyncResponse {
        val token = accessTokenProvider()
            ?: error("No Supabase session — call bggSync only when signed in.")
        api.setBearerToken(token)
        return api.bggSync(
            BggSyncRequest(triggeredBy = BggSyncRequest.TriggeredBy.manual),
        ).body()
    }

    companion object {
        /** Function-host derived from the Supabase project URL. */
        internal fun functionsBaseUrl(supabaseUrl: String): String =
            supabaseUrl.replace(".supabase.co", ".functions.supabase.co")

        /** Lazy app-wide instance bound to the current Supabase session. */
        val instance: EdgeFunctions by lazy {
            check(BuildConfig.SUPABASE_URL.isNotBlank()) {
                "BuildConfig.SUPABASE_URL is empty — populate android/local.properties before calling edge functions."
            }
            val api = DefaultApi(
                baseUrl = functionsBaseUrl(BuildConfig.SUPABASE_URL),
                httpClientEngine = null,
                httpClientConfig = { config ->
                    config.install(ContentNegotiation) {
                        json(
                            Json {
                                ignoreUnknownKeys = true
                                explicitNulls = false
                                serializersModule = SerializersModule {
                                    contextual(UUID::class, UuidSerializer)
                                }
                            },
                        )
                    }
                    config.install(HttpTimeout) {
                        requestTimeoutMillis = 30_000L
                        connectTimeoutMillis = 10_000L
                    }
                },
            )
            EdgeFunctions(
                api = api,
                accessTokenProvider = {
                    val status = SupabaseService.client.auth.sessionStatus.value
                    (status as? SessionStatus.Authenticated)?.session?.accessToken
                },
            )
        }
    }
}

/**
 * `BggSyncRequest.userId` is generated as `@Contextual java.util.UUID`. Provide
 * a String-backed serializer so kotlinx.serialization can round-trip it.
 */
private object UuidSerializer : KSerializer<UUID> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("java.util.UUID", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: UUID) {
        encoder.encodeString(value.toString())
    }

    override fun deserialize(decoder: Decoder): UUID =
        UUID.fromString(decoder.decodeString())
}
