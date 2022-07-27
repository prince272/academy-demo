using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Content : IEntity
    {
        public virtual Lesson Lesson { get; set; }

        public long LessonId { get; set; }

        public long Id { get; set; }

        public int Priority { get; set; }

        public Asset Media { get; set; }

        public long? MediaId { get; set; }

        public string Explanation { get; set; }

        public string Question { get; set; }

        public QuestionType QuestionType { get; set; }

        public virtual ICollection<QuestionAnswer> QuestionAnswers { get; set; } = new List<QuestionAnswer>();

        public double Duration { get; set; }
    }

    public class QuestionAnswer : IEntity
    {
        public long Id { get; set; }

        public int Priority { get; set; }

        public string Description { get; set; }

        public bool Correct { get; set; }

        public virtual Content Content { get; set; }

        public long ContentId { get; set; }
    }

    public enum ContentStatus
    {
        Locked,
        Started,
        Completed
    }

    public enum QuestionType
    {
        Choice,
        Reorder
    }

    public enum QuestionChoice
    {
        Single,
        Multiple
    }
}