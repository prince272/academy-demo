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
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace Academy.Clients.SmsClient
{
    public class TwilioSmsClient : ISmsClient
    {
        private readonly ILogger<TwilioSmsClient> logger;
        private readonly TwilioSmsClientOptions twilioSmsClientOptions;

        public TwilioSmsClient(IServiceProvider services)
        {
            logger = services.GetRequiredService<ILogger<TwilioSmsClient>>();
            twilioSmsClientOptions = services.GetRequiredService<IOptions<TwilioSmsClientOptions>>().Value;
        }

        public Task SendAsync(string phoneNumber, string subject, string message)
        {
            // Find your Account SID and Auth Token at twilio.com/console
            // and set the environment variables. See http://twil.io/secure
            string accountSid = twilioSmsClientOptions.AccountSID;
            string authToken = twilioSmsClientOptions.AuthToken;

            TwilioClient.Init(accountSid, authToken);

            var resource = MessageResource.Create(
                body: message,
                from: new Twilio.Types.PhoneNumber(twilioSmsClientOptions.PhoneNumber),
                to: new Twilio.Types.PhoneNumber(phoneNumber)
            );

            if (resource.ErrorCode != null)
                throw new InvalidOperationException($"Error Code: {resource.ErrorCode}, Error Message: {resource.ErrorMessage}");
           
            return Task.CompletedTask;
        }

        #region Implements IDisposable

        private bool disposed;

        ~TwilioSmsClient()
        {
            Dispose(disposing: false);
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!disposed)
            {
                if (disposing)
                {

                }

                disposed = true;
            }
        }
        #endregion
    }
}
