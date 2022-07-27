using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Post : IEntity
    {
        public long Id { get; set; }

        public DateTimeOffset CreatedOn { get; set; }

        public DateTimeOffset UpdatedOn { get; set; }

        public string Title { get; set; }

        public string Slug { get; set; }

        public string Description { get; set; }

        public bool Commentable { get; set; }

        public bool Published { get; set; }

        public bool Deleted { get; set; }

        public virtual Asset Image { get; set; }

        public long? ImageId { get; set; }
    }
}
