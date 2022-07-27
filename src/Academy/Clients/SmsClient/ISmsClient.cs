using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.SmsClient
{
    public interface ISmsClient : IDisposable
    {
        Task SendAsync(string phoneNumber, string subject, string message);
    }
}
