using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace Academy.Entities
{
    public class User : IdentityUser<long>, IEntity
    {
        public virtual Asset Avatar { get; set; }

        public long? AvatarId { get; set; }

        public DateTimeOffset CreatedOn { get; set; }

        public bool Deleted { get; set; }

        public string PreferredName { get; set; }

        public string Bio { get; set; }

        public string Location { get; set; }

        public decimal Balance { get; set; }

        public virtual ICollection<UserRole> Roles { get; set; } = new List<UserRole>();

        public virtual ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();

        public virtual ICollection<ContentProgress> ContentProgresses { get; set; } = new List<ContentProgress>();

        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public class UserRole : IdentityUserRole<long>
    {
        public virtual User User { get; set; }

        public virtual Role Role { get; set; }
    }

    public class UserFollower
    {
        public long Id { get; set; }

        public virtual User User { get; set; }

        public long UserId { get; set; }

        public long MentorId { get; set; }
    }
}