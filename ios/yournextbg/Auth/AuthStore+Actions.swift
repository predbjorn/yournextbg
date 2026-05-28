import Foundation

extension AuthStore {

    /// Placeholder for the future delete-account edge function. For v2
    /// we surface a "contact support" message instead of actually
    /// deleting, matching the web app's stance. The Profile screen
    /// uses the returned message to populate an alert.
    public static var deleteAccountSupportMessage: String {
        "Email support@yournextbg.com from your account address to delete your account. "
        + "We'll process the request within 7 days."
    }
}
