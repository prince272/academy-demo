using Academy.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public static class UserManagerExtensions
    {
        public static Task<TUser> FindByPhoneNumber<TUser>(this UserManager<TUser> userManager, string phoneNumber)
            where TUser : User
        {
            return userManager.Users.FirstOrDefaultAsync(x => x.PhoneNumber == phoneNumber);
        }

        public static Task<TUser> FindByIdAsync<TUser>(this UserManager<TUser> userManager, long userId)
         where TUser : User
        {
            return userManager.Users.FirstOrDefaultAsync(x => x.Id == userId);
        }
    }
}