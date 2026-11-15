using System.Web.Mvc;

namespace Roblox.Website.Controllers
{
    [RoutePrefix("download")]
    public class DownloadController : Controller
    {
        [HttpGet]
        [Route("windows")]
        public ActionResult Windows()
        {
            ViewBag.Title = "BLOCK16 Windows Client";
            return View();
        }
    }
}