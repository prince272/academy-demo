using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Role : IdentityRole<long>, IEntity
    {
        public virtual ICollection<UserRole> Users { get; set; } = new List<UserRole>();
    }
}
