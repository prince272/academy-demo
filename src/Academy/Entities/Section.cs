using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Section : IEntity
    {
        public virtual Course Course { get; set; }

        public long CourseId { get; set; }

        public long Id { get; set; }

        public int Priority { get; set; }

        public string Title { get; set; }

        public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}