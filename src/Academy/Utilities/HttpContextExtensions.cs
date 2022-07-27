using Academy.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public static class HttpContextExtensions
    {
        public static string GetIPAddress(this HttpContext httpContext)
        {
            var result = string.Empty;

            try
            {
                //first try to get IP address from the forwarded header
                if (httpContext.Request.Headers != null)
                {
                    //the X-Forwarded-For (XFF) HTTP header field is a de facto standard for identifying the originating IP address of a client
                    //connecting to a web server through an HTTP proxy or load balancer
                    var forwardedHttpHeaderKey = "X-FORWARDED-FOR";

                    var forwardedHeader = httpContext.Request.Headers[forwardedHttpHeaderKey];
                    if (!StringValues.IsNullOrEmpty(forwardedHeader))
                        result = forwardedHeader.FirstOrDefault();
                }

                //if this header not exists try get connection remote IP address
                if (string.IsNullOrEmpty(result) && httpContext.Connection.RemoteIpAddress != null)
                    result = httpContext.Connection.RemoteIpAddress.ToString();
            }
            catch { return string.Empty; }

            //some of the validation
            if (result != null && result.Equals("::1", StringComparison.OrdinalIgnoreCase))
                result = "127.0.0.1";

            //"TryParse" doesn't support IPv4 with port number
            if (IPAddress.TryParse(result ?? string.Empty, out IPAddress ip))
                //IP address is valid 
                result = ip.ToString();
            else if (!string.IsNullOrEmpty(result))
                //remove port
                result = result.Split(':').FirstOrDefault();

            return result;
        }

        public static async Task<User> GetCurrentUserAsync(this HttpContext httpContext)
        {
            var userManager = httpContext.RequestServices.GetRequiredService<UserManager<User>>();
            var currentUserKey = "currentUser";
            var currentUser = httpContext.Items[currentUserKey] as User;

            if (currentUser == null)
            {
                currentUser = await userManager.Users
                    .AsSplitQuery()
                    .Include(x => x.Avatar)
                    .Include(x => x.Roles).ThenInclude(x => x.Role)
                    .Include(x => x.Certificates)
                    .Include(x => x.ContentProgresses)
                    .Include(x => x.Payments)
                    .FirstOrDefaultAsync(x => x.Id.ToString() == userManager.GetUserId(httpContext.User));

                httpContext.Items[currentUserKey] = currentUser;
            }

            return currentUser;
        }
    }
}
