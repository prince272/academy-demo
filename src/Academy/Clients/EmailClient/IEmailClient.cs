using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.EmailClient
{
    public interface IEmailClient : IDisposable
    {
        Task SendAsync(string email, string subject, string message);
    }
}
