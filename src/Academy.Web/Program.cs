using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Serilog;
using Serilog.Events;

namespace Academy.Web
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureAppConfiguration(HandleAppConfiguration);
                    webBuilder.ConfigureLogging(HandleLogging);
                }).UseSerilog();

        private static void HandleLogging(ILoggingBuilder loggingBuilder)
        {
            loggingBuilder.ClearProviders();
            loggingBuilder.AddSerilog();
        }

        private static void HandleAppConfiguration(WebHostBuilderContext hostingContext, IConfigurationBuilder configBuilder)
        {
            var hostingEnvironment = hostingContext.HostingEnvironment;
            var loggerConfiguration = new LoggerConfiguration()
                       .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                       .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                       .MinimumLevel.Override("Microsoft.AspNetCore.Identity", LogEventLevel.Error)
                       .Enrich.FromLogContext()
                       .Enrich.WithProperty("ApplicationName", typeof(Program).Assembly.GetName().Name)
                       .Enrich.WithProperty("Environment", hostingContext.HostingEnvironment)
                       .WriteTo.File("logs\\log_.log", rollingInterval: RollingInterval.Day);

            loggerConfiguration.WriteTo.Console();

            Log.Logger = loggerConfiguration.CreateLogger();
        }
    }
}