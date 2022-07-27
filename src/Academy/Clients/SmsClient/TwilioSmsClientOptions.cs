using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.SmsClient
{
    public class TwilioSmsClientOptions
    {
        public string AuthToken { get; set; }

        public string AccountSID { get; set; }

        public string PhoneNumber { get; set; }
    }
}
