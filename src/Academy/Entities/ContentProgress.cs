using System;

namespace Academy.Entities
{
    public class ContentProgress : IEntity
    {
        public long Id { get; set; }

        public virtual User User { get; set; }

        public long UserId { get; set; }

        public virtual Content Content { get; set; }

        public long ContentId { get; set; }

        public DateTimeOffset CreatedOn { get; set; }

        public DateTimeOffset UpdatedOn { get; set; }

        public int Points { get; set; }

        public bool Checked { get; set; }

        public bool Correct { get; set; }
    }
}
