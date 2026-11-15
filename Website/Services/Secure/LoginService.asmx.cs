using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using System.Web.Script.Services;
using System.Web.Security;

namespace Roblox.Website.Services.Secure
{
    /// <summary>
    /// Summary description for LoginService
    /// </summary>
    [WebService(Namespace = "http://roblox.com/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    [System.Web.Script.Services.ScriptService]
    public class LoginService : System.Web.Services.WebService
    {
        public enum ErrorCodeEnum
        {
            None,
            ChallengeOrResponseMissing,
            UnableToVerifyCaptcha,
            ErrorOccurred,
            RequireTwoFactorAuth,
            FeatureDisabled,
            CaptchaChanged,
            IncorrectCredential,
            CaptchaValidation,
            TooManyLoginAttempts
        }

        public class LoginResponse
        {
            public bool IsValid { get; set; }
            public List<string> ErrorCode { get; set; }
            public string Message { get; set; }

            public LoginResponse()
            {
                ErrorCode = new List<string>();
            }

            public void ThrowError(ErrorCodeEnum code)
            {
                ErrorCode.Add(((int)code).ToString());
            }
        }

        // Per-process IP throttling. This is a conservative first layer; production
        // deployments with multiple web servers should also enforce a shared edge limit.
        private static readonly LoginAttemptLimiter LoginLimiter = new LoginAttemptLimiter();

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public LoginResponse ValidateLogin(string userName, string password, bool isCaptchaOn = false, string challenge = "", string captchaResponse = "")
        {
            var loginResponse = new LoginResponse();
            string clientAddress = Context != null && Context.Request != null
                ? Context.Request.UserHostAddress
                : null;

            // Do not trust X-Forwarded-For here: it is client-controlled unless a
            // trusted reverse proxy explicitly strips and rewrites it.
            if (!LoginLimiter.TryAcquire(clientAddress))
            {
                loginResponse.IsValid = false;
                loginResponse.ThrowError(ErrorCodeEnum.TooManyLoginAttempts);
                loginResponse.Message = "Too many login attempts. Please wait a few minutes and try again.";
                return loginResponse;
            }

            if (Membership.ValidateUser(userName, password))
            {
                LoginLimiter.Reset(clientAddress);
                // Use a session cookie; do not persist authentication across browser restarts.
                FormsAuthentication.SetAuthCookie(userName, false);
                loginResponse.IsValid = true;
                loginResponse.Message = "Welcome to BLOCK16.";
            }
            else
            {
                loginResponse.IsValid = false;
                loginResponse.ThrowError(ErrorCodeEnum.IncorrectCredential);
                loginResponse.Message = "Invalid username or password.";
            }

            return loginResponse;
        }

        private sealed class LoginAttemptLimiter
        {
            private const int MaximumAttempts = 20;
            private static readonly TimeSpan WindowLength = TimeSpan.FromMinutes(10);
            private readonly object _sync = new object();
            private readonly Dictionary<string, AttemptWindow> _windows =
                new Dictionary<string, AttemptWindow>();
            private int _operations;

            public bool TryAcquire(string address)
            {
                string key = String.IsNullOrWhiteSpace(address) ? "unknown" : address;
                DateTime now = DateTime.UtcNow;

                lock (_sync)
                {
                    AttemptWindow window;
                    if (!_windows.TryGetValue(key, out window) ||
                        now - window.StartedUtc >= WindowLength)
                    {
                        window = new AttemptWindow(now);
                        _windows[key] = window;
                    }

                    if (window.Count >= MaximumAttempts)
                        return false;

                    window.Count++;

                    if (++_operations % 256 == 0)
                        RemoveExpiredWindows(now);

                    return true;
                }
            }

            public void Reset(string address)
            {
                string key = String.IsNullOrWhiteSpace(address) ? "unknown" : address;
                lock (_sync)
                {
                    AttemptWindow window;
                    if (_windows.TryGetValue(key, out window))
                    {
                        window.Count = 0;
                        window.StartedUtc = DateTime.UtcNow;
                    }
                }
            }

            private void RemoveExpiredWindows(DateTime now)
            {
                var expiredKeys = new List<string>();
                foreach (var entry in _windows)
                {
                    if (now - entry.Value.StartedUtc >= WindowLength)
                        expiredKeys.Add(entry.Key);
                }

                foreach (string key in expiredKeys)
                    _windows.Remove(key);
            }

            private sealed class AttemptWindow
            {
                public AttemptWindow(DateTime startedUtc)
                {
                    StartedUtc = startedUtc;
                }

                public DateTime StartedUtc;
                public int Count;
            }
        }
    }
}
