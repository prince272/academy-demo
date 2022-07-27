using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class CommentSearchModel
    {
        public string EntityName { get; set; }

        public long? EntityId { get; set; }

        public long? ParentId { get; set; }

        public long? Id { get; set; }

        public int? PageNumber { get; set; }
    }
}
