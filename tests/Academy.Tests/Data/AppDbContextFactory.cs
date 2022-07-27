//using Microsoft.EntityFrameworkCore;
//using Microsoft.EntityFrameworkCore.Design;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace Academy.Data
//{
//    // TODO: Don't forget to comment
//    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
//    {
//        public AppDbContext CreateDbContext(string[] args)
//        {
//            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
//            optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=aspnet-Academy.Web-D45227B0-FDE9-4786-8BDF-9F2D52DD16B0;Trusted_Connection=True;MultipleActiveResultSets=true");

//            return new AppDbContext(optionsBuilder.Options, null);
//        }
//    }
//}
