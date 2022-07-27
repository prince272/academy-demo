using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Lesson : IEntity
    {
        public virtual Section Section { get; set; }

        public long SectionId { get; set; }

        public long Id { get; set; }

        public int Priority { get; set; }

        public string Title { get; set; }

        public virtual ICollection<Content> Contents { get; set; } = new List<Content>();
    }
}
