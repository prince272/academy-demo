using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.EmailClient
{
    public class SmtpEmailClientOptions
    {
        public string MailServer { get; set; }

        public int MailPort { get; set; }

        public bool UseSSL { get; set; }

        public string SenderName { get; set; }

        public string SenderEmail { get; set; }

        public string SenderPassword { get; set; }
    }
}
