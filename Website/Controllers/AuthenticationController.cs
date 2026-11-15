using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.Mvc;
using Roblox.Web.Mvc;

namespace Roblox.Website.Controllers
{
    [RoutePrefix("Authentication")]
    [Route("{action}")]
    [CookieConstraintAttributeWithRedirect]
    public class AuthenticationController : Controller
    {
        // POST: Authentication/Logout
        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Logout()
        {
            FormsAuthentication.SignOut();
            return Redirect("~/");
        }
    }
}