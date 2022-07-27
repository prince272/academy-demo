using Academy.Clients.ViewClient;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SpaServices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Web.Extensions
{
    public static class ApplicationBuilderExtensions
    {
        public static async Task GenerateReactDefaultPage(this IApplicationBuilder app, string serverPage, string clientPage)
        {
            var services = app.ApplicationServices.CreateScope().ServiceProvider;
            var viewClient = services.GetRequiredService<IViewClient>();
            var clientContents = await viewClient.RenderViewToStringAsync(serverPage);
            var spaOptions = services.GetRequiredService<IOptions<SpaOptions>>().Value;

            string clientPath = $"{spaOptions.SourcePath}/public/{clientPage}".Replace("/", "\\");
            string clientDirectory = Path.GetDirectoryName(clientPath);

            if (!Directory.Exists(clientDirectory))
                Directory.CreateDirectory(clientDirectory);

            if (File.Exists(clientPath))
                File.Delete(clientPath);

            await File.WriteAllTextAsync(clientPath, clientContents);
        }
    }
}