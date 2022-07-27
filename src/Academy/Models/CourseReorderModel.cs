using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class CourseReorderModel
    {
        public int DraggableId { get; set; }

        public int ParentId { get; set; }

        public string Type { get; set; }

        public Point Source { get; set; }

        public Point Destination { get; set; }

        public class Point
        {
            public int DroppableId { get; set; }

            public int Index { get; set; }
        }
    }
}
