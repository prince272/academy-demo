using Academy.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class PaymentProcessModel
    {
        public PaymentPurpose Purpose { get; set; }

        public TimeSpan? Duration { get; set; }

        public DateTimeOffset? Period => Duration != null ? DateTimeOffset.UtcNow.Add(Duration.Value) : null;

        public string RefString { get; set; }

        public string[] RefArray => RefString?.Split(",").Select(x => x.Trim()).ToArray() ?? Array.Empty<string>();

        public string RedirectUrl { get; set; }
    }
}
