using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class CourseSearchModel
    {
        public long? CourseId { get; set; }

        public long? SectionId { get; set; }

        public long? LessonId { get; set; }

        public long? ContentId { get; set; }
    }
}
