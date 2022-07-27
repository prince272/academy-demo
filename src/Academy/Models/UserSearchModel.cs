using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class UserSearchModel
    {
        public int? PageNumber { get; set; }

        public long? Id { get; set; }

        public long[] CourseIds { get; set; }
    }
}
