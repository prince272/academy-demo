using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class CourseProgressModel
    {
        public long ContentId { get; set; }

        public long[] QuestionAnwserIds { get; set; }
    }
}
