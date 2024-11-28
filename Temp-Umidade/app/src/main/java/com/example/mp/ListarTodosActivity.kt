package com.example.mp

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.firestore.FirebaseFirestore
import java.text.SimpleDateFormat
import java.util.*

class ListarTodosActivity : AppCompatActivity() {

    private lateinit var voltarButton: Button
    private lateinit var listaTextView: TextView
    private val db = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_listar_todos)

        voltarButton = findViewById(R.id.voltarButton)
        listaTextView = findViewById(R.id.listaTextView)

        voltarButton.setOnClickListener {
            finish()
        }

        carregarTodosOsDocumentos()
    }

    private fun carregarTodosOsDocumentos() {
        db.collection("umidadeTemperatura")
            .orderBy("dataHora")
            .get()
            .addOnSuccessListener { querySnapshot ->
                val result = StringBuilder()

                val dateFormat = SimpleDateFormat("dd-MM-yyyy HH:mm:ss", Locale.getDefault())
                dateFormat.timeZone = TimeZone.getTimeZone("America/Sao_Paulo") // UTC-3

                for (document in querySnapshot.documents) {
                    val temperatura = document.getString("temperatura") ?: "N/A"
                    val umidade = document.getString("umidade") ?: "N/A"
                    val dataHora = document.getTimestamp("dataHora")?.toDate()

                    val dataHoraFormatada = if (dataHora != null) {
                        dateFormat.format(dataHora)
                    } else {
                        "Data indisponível"
                    }

                    result.append(
                        "Data e Hora: $dataHoraFormatada\n" +
                                "Temperatura: $temperatura°C\n" +
                                "Umidade: $umidade%\n\n"
                    )
                }

                listaTextView.text = if (result.isNotEmpty()) result.toString() else "Nenhum documento encontrado."
            }
            .addOnFailureListener { e ->
                listaTextView.text = "Erro ao carregar os documentos: ${e.message}"
            }
    }
}
