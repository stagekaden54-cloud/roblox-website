using System;
using System.Web;

namespace Roblox.Website.Login
{
    public partial class ResetPasswordRequest : System.Web.UI.Page
    {
        protected void Page_PreInit(object sender, EventArgs e)
        {
            if (Request.IsAuthenticated)
                Response.Redirect("/", true);
        }
    }
}
