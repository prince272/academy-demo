using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class UserCodeModel
    {
        public long CurrentId { get; set; }

        public string CurrentEmail { get; set; }

        public string CurrentPhoneNumber { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public string Password { get; set; }

        public string Code { get; set; }

        public AccountProvider Provider { get; set; }

        public AccountAction Action { get; set; }
    }

    public enum AccountAction
    {
        Confirm,
        Recover,
    }
}