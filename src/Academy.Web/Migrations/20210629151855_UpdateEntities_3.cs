using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Web.Migrations
{
    public partial class UpdateEntities_3 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Xp",
                table: "ContentProgress",
                newName: "Marks");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Marks",
                table: "ContentProgress",
                newName: "Xp");
        }
    }
}
