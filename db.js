import mysql from "mysql2";

// buat koneksi ke MySQL XAMPP
const connection = mysql.createConnection({
  host: "localhost", // biasanya localhost
  user: "root", // default user XAMPP
  password: "", // defaultnya kosong di XAMPP
  database: "otomasi", // ganti dengan nama database kamu
});

// cek koneksi
connection.connect((err) => {
  if (err) {
    console.error("Koneksi gagal: ", err);
    return;
  }
  console.log("Koneksi berhasil ke MySQL XAMPP!");
});

export default connection;
