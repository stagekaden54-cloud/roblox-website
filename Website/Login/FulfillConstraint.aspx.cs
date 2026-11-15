using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Roblox;
using Roblox.Web.Maintenance;
using Roblox.Web.Code.CookieConstraint;

namespace Roblox.Website.Login
{
    public partial class FulfillConstraint : System.Web.UI.Page
    {
        private string ReturnURL;

        protected void Page_PreInit(object sender, EventArgs e)
        {
            ReturnURL = GetSafeReturnUrl(Request["ReturnUrl"]);

            if (!CookieConstraintManager.IsRequesterConstrained())
            {
                Response.Redirect(ReturnURL, true);
            }
        }

        private static string GetSafeReturnUrl(string candidate)
        {
            if (string.IsNullOrEmpty(candidate) || candidate[0] != '/' ||
                (candidate.Length > 1 && (candidate[1] == '/' || candidate[1] == '\\')) ||
                candidate.IndexOf('\\') >= 0)
            {
                return "/";
            }

            return candidate;
        }

        protected void Page_Load(object sender, EventArgs e)
        {
        }

        protected void Button_OnClick(object sender, EventArgs e)
        {
            var button = (Button)sender;
            var buttonText = button.Text.ToLower();
            var password = Textbox1.Text;

            // Attempt to lift constraint
            CookieConstraintManager.LiftConstraint(password, buttonText);
            Response.Redirect(ReturnURL, true);
        }
    }
}