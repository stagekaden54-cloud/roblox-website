using System;
using System.Web.UI;

namespace Roblox.Website
{
    public partial class Default : System.Web.UI.Page
    {
        protected void Page_PreInit(object sender, EventArgs e)
        {
            // Signed-in visitors continue to their existing account home.
            if (Request.IsAuthenticated)
                Response.Redirect("~/My/Home.aspx", true);

            // Anonymous visitors see the BLOCK16 project homepage.
            // Do not transfer them to the legacy signup form.
        }
    }
}