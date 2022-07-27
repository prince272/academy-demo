using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Comment
    {
        public long Id { get; set; }

        public virtual User User { get; set; }

        public long UserId { get; set; }

        public DateTimeOffset CreatedOn { get; set; }

        public DateTimeOffset UpdatedOn { get; set; }

        public string Message { get; set; }

        public bool Approved { get; set; }

        public string EntityName { get; set; }

        public long EntityId { get; set; }

        public long? ParentId { get; set; }
    }
}
