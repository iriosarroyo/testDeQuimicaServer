/* import { uidVerifiedUser } from "../firebase/authentification.js"
import { mainAuth } from "../firebase/firebaseConfig.js";


test("undefined if false token id", async () => {
    const uid = await uidVerifiedUser("non-sense-string")
    expect(uid).toBe(undefined);
})

test("returns uid", async () => {
    const realUid = "NitusLGLoYOeSleLbdHRIAQGtYF2";
    const idToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY0ZTc2NDk3ZGE3Y2ZhOWNjMDkwZDcwZTIyNDQ2YTc0YjVjNTBhYTkiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiw43DsWlnbyBSw61vcyBBcnJveW8iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKeG9xeXYzMlpqY0llZFdkMk1laHRnQmZkS3Q1b2o3ZWxZRDZKTUczQT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS90ZXN0ZGVxdWltaWNhLWJjZjkwIiwiYXVkIjoidGVzdGRlcXVpbWljYS1iY2Y5MCIsImF1dGhfdGltZSI6MTY1Mzk5MDI3MiwidXNlcl9pZCI6Ik5pdHVzTEdMb1lPZVNsZUxiZEhSSUFRR3RZRjIiLCJzdWIiOiJOaXR1c0xHTG9ZT2VTbGVMYmRIUklBUUd0WUYyIiwiaWF0IjoxNjU0MTkxNjE1LCJleHAiOjE2NTQxOTUyMTUsImVtYWlsIjoiaXJpb3NhcnJveW9AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTAzMTkwMjczOTI0MDA4OTA1MzkiXSwiZW1haWwiOlsiaXJpb3NhcnJveW9AZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.ArUuofcqd4gk_ND3y5z4GusbyZ5eJ62hxXXcivV-kU3CmM6jCegbebtYdnGMqfLYCJ-Klp6mGZ6PSOave3kvkHPlpdyiHqeH0qeS0AIiqincuI5kCtVrTUebQTE5QLoL49m9F_m9LAhlkzHlWpVQyY3yuGsujhy-wfzv7nOyMK3WLxWH7Tk8Y5YaotYZ0ri4v69X0hLMlrh16tLcJ8GIwjxSGyV1j0OEpD79iHsvMSSTbrbXO8Fz0cGoZjnplKzn4a9-jIuj10m7oqgMQTdqEN-5_xiU1eNGLt0x_w9tUPMjHOFshV10bIlt_Eo8P9nldSXnmLAJsKg_HIy0MN_Klg"
    const uid = await uidVerifiedUser(idToken);
    expect(uid).toBe(realUid);
}) */