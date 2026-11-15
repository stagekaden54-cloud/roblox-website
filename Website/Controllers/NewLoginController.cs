using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using Roblox.Platform.Membership;
using Roblox.Web.Mvc;
using Roblox.Website.ViewModels;

namespace Roblox.Website.Controllers
{
    [RoutePrefix("NewLogin")]
    [CookieConstraintAttributeWithRedirect]
    public class NewLoginController : Controller
    {
        private IUserFactory _UserFactory = Global.MembershipDomainFactories.UserFactory;

        private void SetErrorMessage(string message)
        {
            if (!string.IsNullOrEmpty(message))
                ModelState.AddModelError("ErrorMessage", message);
        }

        // GET: NewLogin
        [Route("")]
        public ActionResult Index(string returnUrl = "/")
        {
            if (Request.IsAuthenticated)
            {
                return Redirect("~/");
            }

            var viewModel = new LoginViewModel
            {
                ReturnUrl = returnUrl
            };

            return View(viewModel);
        }

        // POST: NewLogin
        [Route("")]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Index(LoginViewModel model)
        {
            if (!Request.IsAuthenticated)
            {
                SetErrorMessage(model.GetValidationMessage());

                if (ModelState.IsValid)
                {
                    // Handle auth request
                    if (_UserFactory.GetUserByName(model.Username) != null)
                    {
                        if (Membership.ValidateUser(model.Username, model.Password))
                        {
                            // We've been able to validate the user's auth request, now authenticate and redirect
                            // This login form has no 'remember me' option; issue a non-persistent auth cookie.
                            FormsAuthentication.SetAuthCookie(model.Username, false);
                            return Redirect(GetSafeReturnUrl(model.ReturnUrl));
                        }
                        else
                        {
                            // Incorrect username or password
                            SetErrorMessage(model.LoginLangResources["Response.IncorrectUsernamePassword"]);
                        }
                    }
                    else
                    {
                        // Unknown user
                        SetErrorMessage(string.Format(model.LoginLangResources["Label.GreetingForNewAccount"], Server.HtmlEncode(model.Username)));
                    }
                }

                return View(model);
            }

            return Redirect(GetSafeReturnUrl(model.ReturnUrl));
        }

        private string GetSafeReturnUrl(string returnUrl)
        {
            return Url.IsLocalUrl(returnUrl) ? returnUrl : "/";
        }
    }
}