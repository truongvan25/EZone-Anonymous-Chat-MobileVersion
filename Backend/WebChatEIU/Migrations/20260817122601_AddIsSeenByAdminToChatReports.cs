using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebChatEIU.Migrations
{
    /// <inheritdoc />
    public partial class AddIsSeenByAdminToChatReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSeenByAdmin",
                table: "ChatReports",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Report đã tồn tại trước khi có tính năng badge thì coi như Admin
            // đã biết rồi — chỉ report MỚI (tạo sau migration này) mới nên
            // tính vào badge "chưa xem".
            migrationBuilder.Sql("UPDATE ChatReports SET IsSeenByAdmin = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSeenByAdmin",
                table: "ChatReports");
        }
    }
}
