using Academy.Clients.CacheClient;
using Academy.Clients.EmailClient;
using Academy.Clients.FileClient;
using Academy.Clients.PaymentClient;
using Academy.Clients.SmsClient;
using Academy.Clients.ViewClient;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Academy
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddLocalFileClient(this IServiceCollection services, Action<LocalFileClientOptions> configure = null)
        {
            if (configure != null)
                services.Configure(configure);

            services.AddScoped<IFileClient, LocalFileClient>();

            return services;
        }

        public static IServiceCollection AddRazorViewClient(this IServiceCollection services)
        {
            services.AddTransient<IViewClient, RazorViewClient>();
            return services;
        }

        public static IServiceCollection AddSmtpEmailClient(this IServiceCollection services, Action<SmtpEmailClientOptions> configure = null)
        {
            if (configure != null)
                services.Configure(configure);

            services.AddScoped<IEmailClient, SmtpEmailClient>();

            return services;
        }

        public static IServiceCollection AddTwilioSmsClient(this IServiceCollection services, Action<TwilioSmsClientOptions> configure = null)
        {
            if (configure != null)
                services.Configure(configure);

            services.AddScoped<ISmsClient, TwilioSmsClient>();

            return services;
        }

        public static IServiceCollection AddMemoryCacheClient(this IServiceCollection services, Action<MemoryCacheClientOptions> configure = null)
        {
            if (configure != null)
                services.Configure(configure);

            services.AddSingleton<ICacheClient, MemoryCacheClient>();

            return services;
        }

        public static IServiceCollection AddPaySwitchClient(this IServiceCollection services, Action<PaySwitchOptions> configure = null)
        {
            if (configure != null)
                services.Configure(configure);

            services.AddHttpClient(nameof(PaySwitchClient))
                    .AddHttpMessageHandler(services => new TraceLogHandler(services.GetRequiredService<IHttpContextAccessor>(), response => true))
                    .ConfigurePrimaryHttpMessageHandler(_ =>
                   {
                       var handler = new HttpClientHandler();
                       if (handler.SupportsAutomaticDecompression)
                       {
                           handler.AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip;
                       }

                       return handler;
                   });
            services.AddScoped<IPaymentClient, PaySwitchClient>();

            return services;
        }
    }

    internal class TraceLogHandler : DelegatingHandler
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Func<HttpResponseMessage, bool> _shouldLog;

        public TraceLogHandler(IHttpContextAccessor httpContextAccessor, Func<HttpResponseMessage, bool> shouldLog)
        {
            _httpContextAccessor = httpContextAccessor;
            _shouldLog = shouldLog;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            bool logPayloads = false;

            // If you pass a query string parameter "traceme", HttpClient request/response will be logged.
            bool traceMe = _httpContextAccessor.HttpContext.Request.Query.ContainsKey("traceme");

            logPayloads = logPayloads || traceMe;

            HttpResponseMessage response = null;
            try
            {
                response = await base.SendAsync(request, cancellationToken);

                // We run the ShouldLog function that calculates, based on HttpResponseMessage, if we should log HttpClient request/response.
                logPayloads = logPayloads || _shouldLog(response);
            }
            catch (Exception)
            {
                // We want to log HttpClient request/response when some exception occurs, so we can reproduce what caused it.
                logPayloads = true;
                throw;
            }
            finally
            {
                // Finally, we check if we decided to log HttpClient request/response or not.
                // Only if we want to, we will have some allocations for the logger and try to read headers and contents.
                if (logPayloads)
                {
                    var logger = _httpContextAccessor.HttpContext.RequestServices.GetRequiredService<ILogger<TraceLogHandler>>();
                    Dictionary<string, object> scope = new Dictionary<string, object>();

                    scope.TryAdd("request_headers", request);
                    if (request?.Content != null)
                    {
                        scope.Add("request_body", await request.Content.ReadAsStringAsync());
                    }
                    scope.TryAdd("response_headers", response);
                    if (response?.Content != null)
                    {
                        scope.Add("response_body", await response.Content.ReadAsStringAsync());
                    }
                    using (logger.BeginScope(scope))
                    {
                        logger.LogInformation("[TRACE] request/response");
                    }
                }
            }

            return response;
        }
    }
}
