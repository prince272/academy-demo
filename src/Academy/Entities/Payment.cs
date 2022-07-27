using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Payment : IEntity
    {
        public long Id { get; set; }

        public DateTimeOffset CreatedOn { get; set; }

        public DateTimeOffset UpdatedOn { get; set; }

        public virtual User Account { get; set; }

        public long AccountId { get; set; }

        public string AccountName { get; set; }

        public string AccountPhoneNumber { get; set; }

        public string AccountEmail { get; set; }

        public decimal AccountBalance { get; set; }

        public decimal Amount { get; set; }

        public PaymentStatus Status { get; set; }

        public DateTimeOffset? Period { get; set; }

        public PaymentPurpose Purpose { get; set; }

        public string StatusMessage { get; set; }

        public string Gateway { get; set; }

        public string TransactionId { get; set; }

        public string RefString { get; set; }

        public string UAString { get; set; }

        public string IPAddress { get; set; }

        public string CheckoutUrl { get; set; }

        public string RedirectUrl { get; set; }
    }

    public enum PaymentStatus
    {
        Pending,
        Failed,
        Succeeded
    }

    public enum PaymentPurpose
    {
        Learn
    }
}
