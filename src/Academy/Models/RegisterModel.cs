using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class RegisterModel
    {
        public string PreferredName { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public string Password { get; set; }

        public bool Agreed { get; set; }

        public AccountProvider Provider { get; set; }
    }

    public enum AccountProvider
    {
        Email,
        PhoneNumber
    }
}
