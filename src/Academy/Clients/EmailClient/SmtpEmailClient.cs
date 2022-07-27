using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.EmailClient
{
    public class SmtpEmailClient : IEmailClient
    {
        private readonly SmtpEmailClientOptions _emailClientOptions;

        public SmtpEmailClient(IServiceProvider services)
        {
            _emailClientOptions = services.GetRequiredService<IOptions<SmtpEmailClientOptions>>().Value;
        }

        public Task SendAsync(string email, string subject, string message)
        {
            try
            {
                // Credentials
                var credentials = new NetworkCredential(_emailClientOptions.SenderEmail, _emailClientOptions.SenderPassword);

                // Mail message
                var mail = new MailMessage()
                {
                    From = new MailAddress(_emailClientOptions.SenderEmail, _emailClientOptions.SenderName),
                    Subject = subject,
                    Body = message,
                    IsBodyHtml = true
                };

                mail.To.Add(new MailAddress(email));

                // Smtp client
                var client = new SmtpClient()
                {
                    Port = _emailClientOptions.MailPort,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Host = _emailClientOptions.MailServer,
                    EnableSsl = _emailClientOptions.UseSSL,
                    Credentials = credentials,
                };

                // Send it...         
                client.Send(mail);
            }
            catch (Exception ex)
            {
                // TODO: handle exception
                throw new InvalidOperationException(ex.Message);
            }

            return Task.CompletedTask;
        }

        #region Implements IDisposable

        private bool disposed;

        ~SmtpEmailClient()
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
