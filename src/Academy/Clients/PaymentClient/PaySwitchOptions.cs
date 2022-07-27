using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.PaymentClient
{
    public class PaySwitchOptions
    {
        public string MerchantId { get; set; }

        public string ApiUser { get; set; }

        public string ApiKey { get; set; }

        public bool Live { get; set; }
    }
}
