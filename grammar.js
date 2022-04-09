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
        source_file: $ => seq(repeat($.enable_directive), repeat($._declaration)),

        comment: $ => seq("//", /.*/),

        _declaration: $ => choice(
            ";",
            seq($.global_variable_declaration, ";"),
            seq($.global_constant_declaration, ";"),
            seq($.type_alias_declaration, ";"),
            $.struct_declaration,
            $.function_declaration,
        ),

        global_variable_declaration: $ => seq(
            repeat($.attribute), $.variable_declaration, optional(seq("=", $.const_expression))
        ),

        global_constant_declaration: $ => choice(
            seq("let", choice($.identifier, $.variable_identifier_declaration), "=", $.const_expression),
            seq(repeat($.attribute), "override", choice($.identifier, $.variable_identifier_declaration), optional(seq("=", $._expression)))
        ),
        
        const_expresssion: $ => choice(
            seq($.type_declaration, "(", optional(seq(repeat(seq($.const_expression, ",")), $.const_expression, optional(","))), ")"),
            $.const_literal
        ),

        type_alias_declaration: $ => seq(
            "type", $.identifier, "=", $.type_declaration
        ),

        const_expression: $ => prec.left(choice(
            seq($.type_declaration, "(", optional(seq(repeat(seq($.const_expression, ",")), $.const_expression, optional(","))), ")"),
            $.const_literal,
        )),

        function_declaration: $ => seq(
            repeat($.attribute),
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
            repeat($.attribute),
            $.type_declaration,
        ),

        struct_declaration: $ => seq(
            "struct",
            field("name", $.identifier),
            "{",
            seq(repeat(seq($.struct_member, ",")), $.struct_member, optional(",")),
            "}"
        ),

        struct_member: $ => seq(
            repeat($.attribute),
            $.variable_identifier_declaration,
        ),

        enable_directive: $ => seq("enable", $.identifier, ";"),

        attribute: $ => seq(
            "@",
            $.identifier,
            optional(
                seq(
                    "(",
                    repeat(seq($._literal_or_identifier, ",")),
                    $._literal_or_identifier,
                    optional(","),
                    ")"
                )
            )
        ),

        _literal_or_identifier: $ => choice(
            $.float_literal,
            $.int_literal,
            $.identifier,
        ),

        identifier: $ => /([a-zA-Z_][0-9a-zA-Z][0-9a-zA-Z_]*)|([a-zA-Z][0-9a-zA-Z_]*)/,

        parameter_list: $ => seq(
            repeat(
                seq($.parameter, ",")
            ),
            $.parameter,
            optional(",")
        ),

        parameter: $ => seq(
            repeat($.attribute),
            $.variable_identifier_declaration
        ),

        _statement: $ => choice(
            $.compound_statement,
            seq($.assignment_statement, ";"),
            $.if_statement,
            $.switch_statement,
            $.loop_statement,
            $.for_statement,
            $.while_statement,
            $.break_statement,
            $.continue_statement,
            $.discard_statement,
            seq($.return_statement, ";"),
            seq($.variable_statement, ";"),
            $.increment_statement,
            $.decrement_statement
        ),

        compound_statement: $ => seq("{", repeat($._statement), "}"),

        assignment_statement: $ => choice(
            seq(
                field("left", $.lhs_expression),
                choice("=", $.compound_assignment_operator),
                field("right", $._expression),
            ),
            seq(field("left", "_"), "=", field("right", $._expression))
        ),
        
        compound_assignment_operator: $ => choice(...["+", "-", "*", "/", "%", "&", "|", "^"].map(op => `${op}=`)),

        if_statement: $ => seq(
            "if",
            field("condition", $._expression),
            field("consequence", $.compound_statement),
            optional(seq("else", field("alternative", $.else_statement)))
        ),

        else_statement: $ => choice(
            $.compound_statement,
            $.if_statement
        ),

        switch_statement: $ => seq(
            "switch",
            $._expression,
            "{",
            repeat1($.switch_body),
            "}"
        ),

        switch_body: $ => choice(
            seq("case", $.case_selectors, optional(":"), $.case_compound_statement),
            seq("default", optional(":"), $.case_compound_statement)
        ),

        case_selectors: $ => seq(
            $.const_literal,
            repeat(seq(",", $.const_literal)),
            optional(",")
        ),
        
        case_compound_statement: $ => seq(
            "{", repeat($._statement), optional($.fallthrough_statement), "}" 
        ),

        fallthrough_statement: $ => seq("fallthrough", ";"),

        loop_statement: $ => seq(
            "loop", "{", repeat($._statement), optional($.continuing_statement), "}"
        ),

        for_statement: $ => seq(
            "for", "(", $.for_header, ")", $.compound_statement
        ),

        for_header: $ => seq(
            optional(
                choice(
                    $.variable_statement,
                    $.assignment_statement,
                    $.type_constructor_or_function_call_expression,
                    $.increment_statement,
                    $.decrement_statement
                )
            ),
            ";",
            optional($._expression),
            ";",
            optional(
                choice(
                    $.increment_statement,
                    $.decrement_statement,
                    $.assignment_statement,
                    $.type_constructor_or_function_call_expression
                )
            )
        ),
        
        while_statement: $ => seq(
            "while", field("condition", $._expression), $.compound_statement
        ),

        break_statement: $ => seq("break", ";"),

        break_if_statement: $ => seq("break", "if", $._expression, ";"),

        continue_statement: $ => seq("continue", ";"),

        continuing_statement: $ => seq("continuing", $.continuing_compound_statement),
        
        continuing_compound_statement: $ => seq(
            "{", repeat($._statement), optional($.break_if_statement), "}"
        ),

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
            "var", optional($.variable_qualifier), choice($.identifier, $.variable_identifier_declaration)
        ),

        variable_qualifier: $ => seq(
            "<",
            $.address_space,
            optional(seq(",", $.access_mode)),
            ">"
        ),

        variable_identifier_declaration: $ => seq(
            field("name", $.identifier),
            ":",
            field("type", $.type_declaration)
        ),

        increment_statement: $ => seq($.lhs_expression, "++"),

        decrement_statement: $ => seq($.lhs_expression, "--"),



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
            $.float_literal,
            $.bool_literal,
        ),

        int_literal: $ => /(-?0[xX][0-9a-fA-F]+|0|-?[1-9][0-9]*)[iu]?/,

        float_literal: $ => choice(
            /(-?(([0-9]*\.[0-9]+|[0-9]+\.[0-9]*)([eE](\+|-)?[0-9]+)?)|([0-9]+[eE](\+|-)?[0-9]+))f?|0f|-?[1-9][0-9]*f/,
            /-?0[xX]((([0-9a-fA-F]*\.[0-9a-fA-F]+|[0-9a-fA-F]+\.[0-9a-fA-F]*)([pP](\+|-)?[0-9]+f?)?)|([0-9a-fA-F]+[pP](\+|-)?[0-9]+f?))/
        ),

        bool_literal: $ => choice("true", "false"),

        parenthesized_expression: $ => seq("(", $._expression, ")"),

        type_constructor_or_function_call_expression: $ => seq(
            choice($.type_declaration, $._vec_prefix, $._mat_prefix),
            $.argument_list_expression
        ),

        type_declaration: $ => choice(
            "bool",
            "u32",
            "i32",
            "f32",
            "i32",
            seq($._vec_prefix, "<", $.type_declaration, ">"),
            seq($._mat_prefix, "<", $.type_declaration, ">"),
            seq(
                "array",
                "<",
                $.type_declaration,
                optional(seq(",", choice($.int_literal, $.identifier))),
                ">"
            ),
            seq("ptr", "<", $.address_space, ",", $.type_declaration, optional(seq(",", $.access_mode)), ">"),
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

        _vec_prefix: $ => choice(...[2, 3, 4].map(n => "vec" + n)),

        _mat_prefix: $ => choice(...cartesianProduct([2, 3, 4], [2, 3, 4]).map(([n, m]) => `mat${n}x${m}`)),

        texel_format: $ => choice(
            ...["unorm", "snorm", "uint", "sint"].map(s => "rgba8" + s),
            ...cartesianProduct(["rgba16", "r32", "rg32", "rgba32"], ["uint", "sint", "float"]).map(([t, s]) => t + s)
        ),

        address_space: $ => choice("function", "private", "workgroup", "uniform", "storage"),

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
        
        postfix_expression: $ => prec.left(PREC.UNARY, seq( // TODO consider replacing the subscript_expression and composite_value_decomposition_expression
            choice(
                seq("[", $._expression, "]", optional($.postfix_expression)),
                seq(".", $.identifier, optional($.postfix_expression))
            ),
            optional($.postfix_expression)
        )),
        
        subscript_expression: $ => prec(PREC.UNARY, seq(
            field("value", $._expression), "[", field("subscript", $._expression), "]"
        )),
        
        lhs_expression: $ => seq(
            repeat(choice("*", "&")),
            choice(
                $.identifier, 
                seq("(", $.lhs_expression, ")")
            ),
            optional($.postfix_expression)
        ),

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