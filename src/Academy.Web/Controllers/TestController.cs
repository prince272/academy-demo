using Academy.Entities;
using Academy.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Web.Controllers
{
    [Route("api/tests")]
    [ApiController]
    public class TestController : Controller
    {
        private readonly UserService _userService;

        public TestController(UserService userService)
        {
            _userService = userService;
        }

        [HttpGet("throw")]
        public IActionResult Throw()
        {
            throw new NotImplementedException();
        }
    }
}
