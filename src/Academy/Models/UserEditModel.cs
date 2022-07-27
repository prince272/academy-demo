using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class UserEditModel
    {
        public string PreferredName { get; set; }

        public string UserName { get; set; }

        public string Bio { get; set; }

        public string Location { get; set; }

        public long? AvatarId { get; set; }
    }
}
