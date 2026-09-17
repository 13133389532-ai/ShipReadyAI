export async function DELETE(req: Request) {
  return Response.json({deleted: true});
}
