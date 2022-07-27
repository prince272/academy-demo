using Academy.Data;
using Academy.Entities;
using Academy.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.PaymentClient
{
    public class PaySwitchClient : IPaymentClient
    {
        private readonly HttpContext httpContext;
        private readonly ILogger<PaySwitchClient> logger;
        private readonly PaySwitchOptions paySwitchOptions;
        private readonly AppDbContext dbContext;
        private readonly HttpClient paySwitchClient;

        public PaySwitchClient(IServiceProvider services)
        {
            httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
            logger = services.GetRequiredService<ILogger<PaySwitchClient>>();
            paySwitchOptions = services.GetRequiredService<IOptions<PaySwitchOptions>>().Value;
            dbContext = services.GetRequiredService<AppDbContext>();
            paySwitchClient = services.GetRequiredService<IHttpClientFactory>().CreateClient(nameof(PaySwitchClient));
            paySwitchClient.BaseAddress = new Uri(paySwitchOptions.Live ? "https://prod.theteller.net" : "https://test.theteller.net");

        }

        public async Task ProcessAsync(Payment payment)
        {
            if (payment == null)
                throw new ArgumentNullException(nameof(payment));

            var response = await paySwitchClient.SendAsJsonAsync("/checkout/initiate", HttpMethod.Post,
                headers: new Dictionary<string, string> {
                    { "Authorization", GetAuthorizationHeader() }
                },
                data: new Dictionary<string, string>
            {
                { "merchant_id", paySwitchOptions.MerchantId },
                { "transaction_id", payment.TransactionId },
                { "desc", $"Payment for {payment.Purpose.GetDisplayName()}"  },
                { "amount", ((payment.Amount) * 100).ToString("000000000000") },
                { "redirect_url", payment.RedirectUrl },
                { "email", payment.AccountEmail },
                { "API_Key", paySwitchOptions.ApiKey },
                { "apiuser", paySwitchOptions.ApiUser }
            });

            var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>();

            payment.UAString = httpContext.Request.Headers["User-Agent"];
            payment.IPAddress = httpContext.GetIPAddress();
            payment.Gateway = "PaySwitch";
            payment.Status = (responseData.GetValueOrDefault("code") == "200") ? PaymentStatus.Pending : PaymentStatus.Failed;
            payment.StatusMessage = responseData.GetValueOrDefault("reason");
            payment.CheckoutUrl = responseData.GetValueOrDefault("checkout_url");

            if (payment.Status == PaymentStatus.Pending)
            {
                dbContext.Add(payment);
                await dbContext.SaveChangesAsync();
            }
        }

        public async Task VerifyAsync(Payment payment)
        {
            if (payment == null)
                throw new ArgumentNullException(nameof(payment));

            if (payment.Status == PaymentStatus.Pending)
            {
                var response = await paySwitchClient.SendAsJsonAsync($"/v1.1/users/transactions/{payment.TransactionId}/status", HttpMethod.Post,
                headers: new Dictionary<string, string> {
                    { "Merchant-Id", paySwitchOptions.MerchantId }
                });
                var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>();

                payment.Status = responseData.GetValueOrDefault("code") == "000" ? PaymentStatus.Succeeded : PaymentStatus.Failed;
                payment.StatusMessage = responseData.GetValueOrDefault("reason");

                dbContext.Update(payment);
                await dbContext.SaveChangesAsync();
            }
        }

        public string GenerateTransactionId()
        {
            return ComputeHelper.GenerateRandomString(12, ComputeHelper.NATURAL_NUMERIC_CHARS);
        }

        private string GetAuthorizationHeader()
        {
           return $"Basic {Convert.ToBase64String(Encoding.UTF8.GetBytes($"{paySwitchOptions.ApiUser}:{paySwitchOptions.ApiKey}"))}";
        }
    }
}
