using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.Mvc;

namespace Roblox.Website.Controllers
{
    [RoutePrefix("Authentication")]
    [Route("{action}")]
    public class AuthenticationController : Controller
    {
        // POST: Authentication/Logout
        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Logout()
        {
            // Revoke the forms-authentication ticket and discard server-side
            // session state so it cannot be reused after the user signs out.
            FormsAuthentication.SignOut();

            if (Session != null)
            {
                Session.Clear();
                Session.Abandon();
            }

            return Redirect("~/");
        }
    }
}