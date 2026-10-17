using ShuttleSync.Service.Vouchers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShuttleSync.Service.Booking;

namespace ShuttleSync.API.Controllers;
[Authorize, Route("api/v1/vouchers")]
public sealed class VouchersController(IVoucherService vouchers) : ApiControllerBase
{
    [Authorize(Roles = "admin"), HttpGet("admin/all")]
    public async Task<IActionResult> All(CancellationToken ct) => Success(await vouchers.AllAsync(ct));
    [Authorize(Roles = "admin"), HttpPost("admin/global")]
    public async Task<IActionResult> Global(VoucherRequest input, CancellationToken ct) => SuccessCreated(await vouchers.CreateAsync(UserId, input, true, ct));
    [Authorize(Roles = "admin"), HttpPatch("admin/{id}/approve")]
    public async Task<IActionResult> Approve(string id, VoucherApprovalRequest input, CancellationToken ct) => Success(await vouchers.ApproveAsync(id, input.Status, ct));
    [Authorize(Roles = "court_owner,admin"), HttpGet("owner/me")]
    public async Task<IActionResult> Mine(CancellationToken ct) => Success(await vouchers.MineAsync(UserId, ct));
    [Authorize(Roles = "court_owner,admin"), HttpPost("owner/request")]
    public async Task<IActionResult> RequestVoucher(VoucherRequest input, CancellationToken ct) => SuccessCreated(await vouchers.CreateAsync(UserId, input, false, ct));
    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, VoucherRequest input, CancellationToken ct) => Success(await vouchers.UpdateAsync(UserId, Role, id, input, ct));
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await vouchers.DeleteAsync(UserId, Role, id, ct);
        return Success();
    }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate(ValidateVoucherRequest input, CancellationToken ct) => Success(await vouchers.ValidateAsync(input, ct));
}
