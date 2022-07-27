using Academy.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.PaymentClient
{
    public interface IPaymentClient
    {
        Task ProcessAsync(Payment payment);

        Task VerifyAsync(Payment payment);

        string GenerateTransactionId();
    }
}
