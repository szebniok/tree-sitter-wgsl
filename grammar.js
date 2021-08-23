const PREC = {
    OR: 1,
    AND: 2,
    BIT_OR: 3,
    BIT_XOR: 4,
    BIT_AND: 5,
    EQ: 6,
    CMP: 7,
    SHIFT: 8,
    ADD: 9,
    MUL: 10,
    UNARY: 11
}

module.exports = grammar({
    name: "wgsl",

    word: $ => $.identifier,

    extras: $ => [
        $.comment,
        // https://github.com/tree-sitter/tree-sitter-javascript/blob/2c5b138ea488259dbf11a34595042eb261965259/grammar.js#L11
        /[\s\uFEFF\u2060\u200B\u00A0]/
    ],

    rules: {
        source_file: $ => repeat($._declaration),

        comment: $ => seq("//", /.*/),

        _declaration: $ => choice(
            ";",
            seq($.global_variable_declaration, ";"),
            seq($.global_constant_declaration, ";"),
            seq($.type_alias, ";"),
            seq($.struct_declaration, ";"),
            $.function_declaration,
            seq($.enable_directive, ";")
        ),

        global_variable_declaration: $ => seq(
            repeat($.attribute_list), $.variable_declaration, optional(seq("=", $.const_expression))
        ),

        global_constant_declaration: $ => seq(
            repeat($.attribute_list), "let", $.variable_identifier_declaration, optional(seq("=", $.const_expression))
        ),

        type_alias: $ => seq(
            "type", $.identifier, "=", repeat($.attribute_list), $.type_declaration
        ),

        const_expression: $ => prec.left(choice(
            seq($.type_declaration, "(", optional(seq(repeat(seq($.const_expression, ",")), $.const_expression, optional(","))), ")"),
            $.const_literal,
        )),

        function_declaration: $ => seq(
            repeat($.attribute_list),
            "fn",
            field("name", $.identifier),
            "(",
            field("parameters", optional($.parameter_list)),
            ")",
            field("type", optional($.function_return_type_declaration)),
            field("body", $.compound_statement)
        ),

        function_return_type_declaration: $ => seq(
            "->",
            repeat($.attribute_list),
            $.type_declaration,
        ),

        struct_declaration: $ => seq(
            repeat($.attribute_list),
            "struct",
            field("name", $.identifier),
            "{",
            field("body", optional($.struct_member_list)),
            "}"
        ),

        struct_member_list: $ => repeat1($.struct_member),

        struct_member: $ => seq(
            repeat($.attribute_list),
            $.variable_identifier_declaration,
            ";"
        ),

        enable_directive: $ => seq("enable", $.identifier),

        attribute_list: $ => seq(
            "[[",
            repeat(
                seq(
                    $.attribute,
                    ","
                )
            ),
            $.attribute,
            "]]"
        ),

        attribute: $ => seq(
            $.identifier,
            optional(
                seq(
                    "(",
                    $.literal_or_identifier,
                    ")"
                )
            )
        ),

        literal_or_identifier: $ => choice(
            $.float_literal,
            $.int_literal,
            $.uint_literal,
            $.identifier,
        ),

        identifier: $ => /[a-zA-Z][0-9a-zA-Z_]*/,

        parameter_list: $ => seq(
            repeat(
                seq($.parameter, ",")
            ),
            $.parameter,
            optional(",")
        ),

        parameter: $ => seq(
            repeat($.attribute_list),
            $.variable_identifier_declaration
        ),

        _statement: $ => choice(
            $.compound_statement,
            seq($.assignment_statement, ";"),
            $.if_statement,
            $.switch_statement,
            $.loop_statement,
            $.for_statement,
            $.break_statement,
            $.continue_statement,
            $.discard_statement,
            seq($.return_statement, ";"),
            seq($.variable_statement, ";"),
        ),

        compound_statement: $ => seq("{", repeat($._statement), "}"),

        assignment_statement: $ => seq(
            field("left", $._expression), // TODO singular expression
            "=",
            field("right", $._expression),
        ),

        if_statement: $ => seq(
            "if",
            field("condition", $.parenthesized_expression),
            field("consequence", $.compound_statement),
            repeat(field("alternative", $.elseif_statement)),
            field("alternative", optional($.else_statement))
        ),

        elseif_statement: $ => seq(
            "elseif",
            $.parenthesized_expression,
            $.compound_statement,
        ),

        else_statement: $ => seq(
            "else",
            $.compound_statement,
        ),

        switch_statement: $ => seq(
            "switch",
            $.parenthesized_expression,
            "{",
            repeat1($.switch_body),
            "}"
        ),

        switch_body: $ => choice(
            seq("case", $.case_selectors, ":", "{", optional($.case_body), "}"),
            seq("default", ":", "{", $.case_body, "}")
        ),

        case_selectors: $ => seq(
            $.const_literal,
            repeat(seq(",", $.const_literal)),
            optional(",")
        ),

        case_body: $ => choice(
            seq($._statement, $.case_body),
            seq("fallthrough", ";")
        ),

        loop_statement: $ => seq(
            "loop", "{", repeat($._statement), optional($.continuing_statement), "}"
        ),

        for_statement: $ => seq(
            "for", "(", $.for_header, ")", $.compound_statement
        ),

        for_header: $ => seq(
            optional(
                choice($.variable_statement, $.assignment_statement, $.type_constructor_or_function_call_expression)
            ),
            ";",
            optional($._expression),
            ";",
            optional(choice($.assignment_statement, $.type_constructor_or_function_call_expression))
        ),

        break_statement: $ => seq("break", ";"),

        continue_statement: $ => seq("continue", ";"),

        continuing_statement: $ => seq("continuing", $.compound_statement),

        return_statement: $ => seq("return", optional($._expression)),

        discard_statement: $ => seq("discard", ";"),

        variable_statement: $ => choice(
            $.variable_declaration,
            seq($.variable_declaration, "=", $._expression),
            seq(
                "let",
                choice(
                    $.identifier,
                    $.variable_identifier_declaration
                ),
                "=",
                $._expression,
            )
        ),

        variable_declaration: $ => seq(
            "var", optional($.variable_qualifier), $.variable_identifier_declaration
        ),

        variable_qualifier: $ => seq(
            "<",
            $.storage_class,
            optional(seq(",", $.access_mode)),
            ">"
        ),

        variable_identifier_declaration: $ => seq(
            field("name", $.identifier),
            ":",
            repeat($.attribute_list),
            field("type", $.type_declaration)
        ),


        // EXPRESSIONS

        _expression: $ => choice(
            $.const_literal,
            $.parenthesized_expression,
            $.type_constructor_or_function_call_expression,
            $.composite_value_decomposition_expression,
            $.bitcast_expression,
            $.binary_expression,
            $.unary_expression,
            $.subscript_expression,
            $.identifier,
        ),

        const_literal: $ => choice(
            $.int_literal,
            $.uint_literal,
            $.float_literal,
            $.true,
            $.false
        ),

        int_literal: $ => /-?0x[0-9a-fA-F]+|0|-?[1-9][0-9]*/,

        uint_literal: $ => /0x[0-9a-fA-F]u+|0u|[1-9][0-9]*u/,

        float_literal: $ => choice(
            /-?(([0-9]*\.[0-9]+)|([0-9]+\.[0-9]*))((e|E)(\+|-)?[0-9]+)?/,
            /-?0x(([0-9a-fA-F]*\.[0-9a-fA-F]+)|([0-9a-fA-F]+\.[0-9a-fA-F]*))(p|P)(\+|-)?[0-9]+/
        ),

        true: $ => "true",

        false: $ => "false",

        parenthesized_expression: $ => seq("(", $._expression, ")"),

        type_constructor_or_function_call_expression: $ => seq(
            $.type_declaration,
            $.argument_list_expression
        ),

        type_declaration: $ => choice(
            "bool",
            "u32",
            "i32",
            "f32",
            "i32",
            ...[2, 3, 4].map(n => "vec" + n).map(t => withTypeParameter($, t)),
            ...cartesianProduct([2, 3, 4], [2, 3, 4]).map(([n, m]) => `mat${n}x${m}`).map(t => withTypeParameter($, t)),
            withTypeParameter($, "atomic", choice("u32", "i32")),
            seq(
                //repeat($.attribute_list), // TODO ambiguous grammar? conflicting with variable_identifier_declaration
                "array",
                "<",
                $.type_declaration,
                optional(seq(",", $.int_literal)),
                ">"
            ),
            seq("ptr", "<", $.storage_class, ",", $.type_declaration, optional(seq(",", $.access_mode)), ">"),
            "sampler",
            "sampler_comparison",
            ...["2d", "2d_array", "cube", "cube_array", "multisampled_2d"]
                .map(s => "texture_depth_" + s),
            ...["1d", "2d", "2d_array", "3d", "cube", "cube_array", "multisampled_2d"]
                .map(s => "texture_" + s)
                .map(t => withTypeParameter($, t, choice("f32", "i32", "u32"))),
            ...["1d", "2d", "2d_array", "3d"]
                .map(s => "texture_storage_" + s)
                .map(t => seq(t, "<", $.texel_format, ",", $.access_mode, ">")),
            $.identifier,
        ),

        texel_format: $ => choice(
            ...cartesianProduct(["r8", "rg8"], ["unorm", "snorm", "uint", "sint"]).map(([t, s]) => t + s),
            ...cartesianProduct(["r16", "rg16", "rgba16", "r32", "rg32", "rgba32"], ["uint", "sint", "float"]).map(([t, s]) => t + s),
            ...["unorm", "unorm_srgb", "snorm", "uint", "sint"].map(s => "rgba8" + s),
            "rg10a2unorm",
            "rg11b10float"
        ),

        storage_class: $ => choice("function", "private", "workgroup", "uniform", "storage"),

        access_mode: $ => choice("read", "write", "read_write"),

        argument_list_expression: $ => seq(
            "(",
            optional(
                seq(
                    repeat(
                        seq(
                            $._expression,
                            ","
                        )
                    ),
                    $._expression,
                    optional(",")
                ),
            ),
            ")"
        ),

        bitcast_expression: $ => seq(
            "bitcast", "<", $.type_declaration, ">", $.parenthesized_expression
        ),

        binary_expression: $ => choice(
            ...[
                ["||", PREC.OR],
                ["&&", PREC.AND],
                ["|", PREC.BIT_OR],
                ["^", PREC.BIT_XOR],
                ["&", PREC.BIT_AND],
                ["==", PREC.EQ],
                ["!=", PREC.EQ],
                ["<", PREC.CMP],
                [">", PREC.CMP],
                ["<=", PREC.CMP],
                [">=", PREC.CMP],
                ["<<", PREC.SHIFT],
                [">>", PREC.SHIFT],
                ["+", PREC.ADD],
                ["-", PREC.ADD],
                ["*", PREC.MUL],
                ["/", PREC.MUL],
                ["%", PREC.MUL],
            ].map(([op, p]) => prec.left(p, seq(field("left", $._expression), op, field("right", $._expression)))),
        ),

        unary_expression: $ => prec.left(PREC.UNARY,
            seq(
                choice("-", "!", "~", "*", "&"),
                field("argument", $._expression)
            )
        ),

        subscript_expression: $ => prec(PREC.UNARY, seq(
            field("value", $._expression), "[", field("subscript", $._expression), "]"
        )),

        composite_value_decomposition_expression: $ => prec(PREC.UNARY, seq(
            field("value", $._expression), ".", field("accessor", $.identifier)
        ))
    }
})

function withTypeParameter($, type, allowed_type_params) {
    const type_param = allowed_type_params ?? $.type_declaration
    return seq(type, "<", type_param, ">");
}

function cartesianProduct(...lists) {
    return lists.reduce((as, bs) => as.flatMap(a => bs.map(b => [a, b].flat())))
}