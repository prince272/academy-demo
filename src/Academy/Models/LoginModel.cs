using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class LoginModel
    {
        public string PhoneNumber { get; set; }

        public string Email { get; set; }

        public string Password { get; set; }

        public AccountProvider Provider { get; set; }
    }
}
